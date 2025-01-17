# Copyright (c) 2013, 2018 National Technology and Engineering Solutions of Sandia, LLC . Under the terms of Contract
# DE-NA0003525 with National Technology and Engineering Solutions of Sandia, LLC, the U.S. Government
# retains certain rights in this software.

import csv
import time
import numpy

import slycat.web.server
import cherrypy

def parse_file(file, model, database):
    """
  parses out a csv file into numpy array by column (data), the dimension meta data(dimensions),
  and sets attributes (attributes)
  :param file: csv file to be parsed
  :returns: attributes, dimensions, data
  """
    def isfloat(value):
        try:
            float(value)
            return True
        except ValueError:
            return False

    invalid_csv = False  # CSV is completely missing a column header (it isn't just a blank string)
    content = file.splitlines()
    csv_reader = csv.reader(content)
    headings = next(csv_reader)
    first_line = next(csv_reader)

    if len(headings) != len(first_line):
        invalid_csv = True

    rows = [row for row in
            csv.reader(file.splitlines(), delimiter=",", doublequote=True, escapechar=None, quotechar='"',
                       quoting=csv.QUOTE_MINIMAL, skipinitialspace=True)]
    if len(rows) < 2:
        cherrypy.log.error("slycat-csv-parser.py parse_file", "File must contain at least two rows.")
        raise Exception("File must contain at least two rows.")

    attributes = []
    dimensions = [{"name": "row", "type": "int64", "begin": 0, "end": len(rows[1:])}]
    data = []
    default_name_index = 0
    duplicate_name_index = 0
    duplicate_names = []
    duplicate_indeces = []
    blank_header_columns = []
    column_headers = []
    error_message = []
    duplicate_headers = False
    blank_headers = False  # Header with a blank string, i.e. ",,"

    # go through the csv by column
    for column in zip(*rows):
        column_has_floats = False

        # start from 1 to avoid the column name
        for value in column[1:]:
            if isfloat(value):
                column_has_floats = True
                try:  # note NaN's are floats
                    output_list = ['NaN' if x == '' else x for x in column[1:]]
                    data.append(numpy.array(output_list).astype("float64"))
                    attributes.append({"name": column[0], "type": "float64"})
                    column_headers.append(column[0])

                # could not convert something to a float defaulting to string
                except Exception as e:
                    column_has_floats = False
                    cherrypy.log.error("found floats but failed to convert, switching to string types Trace: %s" % e)
                break
        if not column_has_floats:
            [str(item) for item in column[1:]]

            data.append(numpy.array(column[1:]))
            attributes.append({"name": column[0], "type": "string"})
            column_headers.append(column[0])

    if len(attributes) < 1:
        cherrypy.log.error("slycat-csv-parser.py parse_file", "File must contain at least one column.")
        raise Exception("File must contain at least one column.")

# Adding deafult headers and making duplicates unique

    for index, attribute in enumerate(attributes):
        if attribute["name"] is "":
            message = "Column " + str(index + 1)
            blank_header_columns.append(message)
            blank_headers = True
        # Don't want to include blank headers as duplicates.
        if column_headers.count(attribute["name"]) > 1 and attribute["name"] is not '':
            duplicate_names.append(attribute["name"])
            duplicate_indeces.append(str(index + 1))
            duplicate_headers = True

    if invalid_csv is True:
        error_message.append(
            "Your CSV is invalid because it's missing at least one column header. Please CLOSE this wizard, fix the issue, then start a new wizard. \n")
    else:
        if blank_headers is True:
            error_message.append("Your CSV file contained blank headers in: \n")
            for message in blank_header_columns:
                error_message.append(
                    "%s \n" % message)
        if duplicate_headers is True:
            error_message.append("Your CSV file contained these identical headers: \n ")
            for name, index in zip(duplicate_names, duplicate_indeces):
                error_message.append(
                    "%s \n" % str("'" + name + "' " + "in column " + index))

    if error_message is not "":
        slycat.web.server.put_model_parameter(database, model, "error-messages", error_message)
    else:
        slycat.web.server.put_model_parameter(database, model, "error-messages", "")

    return attributes, dimensions, data


def parse(database, model, input, files, aids, **kwargs):
    """
    parses a file as a csv and then uploads the parsed data to associated storage for a
    model
    :param database: slycat.web.server.database.couchdb.connect()
    :param model: database.get("model", self._mid)
    :param input: boolean
    :param files: files to be parsed
    :param aids: artifact ID
    :param kwargs:
    """
    start = time.time()
    if len(files) != len(aids):
        cherrypy.log.error("slycat-csv-parser.py parse", "Number of files and artifact IDs must match.")
        raise Exception("Number of files and artifact ids must match.")

    parsed = [parse_file(file, model, database) for file in files]

    array_index = int(kwargs.get("array", "0"))
    for (attributes, dimensions, data), aid in zip(parsed, aids):
        slycat.web.server.put_model_arrayset(database, model, aid, input)
        slycat.web.server.put_model_array(database, model, aid, 0, attributes, dimensions)
        slycat.web.server.put_model_arrayset_data(database, model, aid, "%s/.../..." % array_index, data)
    end = time.time()

    model = database.get("model", model['_id'])
    model["db_creation_time"] = (end - start)
    database.save(model)


def register_slycat_plugin(context):
    context.register_parser("slycat-csv-parser", "Comma separated values (CSV)", ["table"], parse)
